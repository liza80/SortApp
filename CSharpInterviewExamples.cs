using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InterviewExamples
{
    // ====================================================================================
    // DESIGN PATTERNS
    // ====================================================================================

    #region 1. SINGLETON PATTERN
    // Thread-safe Singleton using Lazy<T>
    public class DatabaseConnection
    {
        private static readonly Lazy<DatabaseConnection> _instance = 
            new Lazy<DatabaseConnection>(() => new DatabaseConnection());

        private DatabaseConnection()
        {
            Console.WriteLine("Database connection created");
        }

        public static DatabaseConnection Instance => _instance.Value;

        public void ExecuteQuery(string query)
        {
            Console.WriteLine($"Executing: {query}");
        }
    }
    #endregion

    #region 2. FACTORY PATTERN
    // Factory Pattern for creating different types of loggers
    public interface ILogger
    {
        void Log(string message);
    }

    public class FileLogger : ILogger
    {
        public void Log(string message)
        {
            Console.WriteLine($"[FILE] {DateTime.Now}: {message}");
        }
    }

    public class DatabaseLogger : ILogger
    {
        public void Log(string message)
        {
            Console.WriteLine($"[DB] {DateTime.Now}: {message}");
        }
    }

    public class LoggerFactory
    {
        public static ILogger CreateLogger(string type)
        {
            return type.ToUpper() switch
            {
                "FILE" => new FileLogger(),
                "DATABASE" => new DatabaseLogger(),
                _ => throw new ArgumentException("Invalid logger type")
            };
        }
    }
    #endregion

    #region 3. OBSERVER PATTERN
    // Observer Pattern for event notifications
    public interface IObserver
    {
        void Update(string message);
    }

    public class EmailNotifier : IObserver
    {
        public void Update(string message)
        {
            Console.WriteLine($"Email sent: {message}");
        }
    }

    public class SmsNotifier : IObserver
    {
        public void Update(string message)
        {
            Console.WriteLine($"SMS sent: {message}");
        }
    }

    public class Subject
    {
        private List<IObserver> _observers = new List<IObserver>();

        public void Attach(IObserver observer)
        {
            _observers.Add(observer);
        }

        public void Detach(IObserver observer)
        {
            _observers.Remove(observer);
        }

        public void Notify(string message)
        {
            foreach (var observer in _observers)
            {
                observer.Update(message);
            }
        }
    }
    #endregion

    #region 4. REPOSITORY PATTERN
    // Repository Pattern for data access
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public interface IUserRepository
    {
        Task<User> GetByIdAsync(int id);
        Task<IEnumerable<User>> GetAllAsync();
        Task AddAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(int id);
    }

    public class UserRepository : IUserRepository
    {
        private readonly List<User> _users = new List<User>();

        public async Task<User> GetByIdAsync(int id)
        {
            await Task.Delay(100); // Simulate database delay
            return _users.FirstOrDefault(u => u.Id == id);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            await Task.Delay(100);
            return _users.ToList();
        }

        public async Task AddAsync(User user)
        {
            await Task.Delay(100);
            _users.Add(user);
        }

        public async Task UpdateAsync(User user)
        {
            await Task.Delay(100);
            var existing = _users.FirstOrDefault(u => u.Id == user.Id);
            if (existing != null)
            {
                existing.Name = user.Name;
                existing.Email = user.Email;
            }
        }

        public async Task DeleteAsync(int id)
        {
            await Task.Delay(100);
            _users.RemoveAll(u => u.Id == id);
        }
    }
    #endregion

    // ====================================================================================
    // MULTITHREADING
    // ====================================================================================

    #region MULTITHREADING EXAMPLES
    public class MultithreadingExamples
    {
        // Example 1: Basic Thread creation
        public void BasicThreadExample()
        {
            Thread thread1 = new Thread(() =>
            {
                for (int i = 0; i < 5; i++)
                {
                    Console.WriteLine($"Thread 1: {i}");
                    Thread.Sleep(1000);
                }
            });

            Thread thread2 = new Thread(() =>
            {
                for (int i = 0; i < 5; i++)
                {
                    Console.WriteLine($"Thread 2: {i}");
                    Thread.Sleep(1000);
                }
            });

            thread1.Start();
            thread2.Start();

            // Wait for threads to complete
            thread1.Join();
            thread2.Join();
        }

        // Example 2: Thread synchronization using lock
        private readonly object _lockObject = new object();
        private int _counter = 0;

        public void ThreadSynchronizationExample()
        {
            var threads = new Thread[5];

            for (int i = 0; i < 5; i++)
            {
                int threadNum = i;
                threads[i] = new Thread(() =>
                {
                    for (int j = 0; j < 1000; j++)
                    {
                        lock (_lockObject)
                        {
                            _counter++;
                        }
                    }
                    Console.WriteLine($"Thread {threadNum} completed");
                });
            }

            foreach (var thread in threads)
                thread.Start();

            foreach (var thread in threads)
                thread.Join();

            Console.WriteLine($"Final counter value: {_counter}");
        }

        // Example 3: Using ThreadPool
        public void ThreadPoolExample()
        {
            for (int i = 0; i < 10; i++)
            {
                int taskNum = i;
                ThreadPool.QueueUserWorkItem(state =>
                {
                    Console.WriteLine($"Task {taskNum} running on thread {Thread.CurrentThread.ManagedThreadId}");
                    Thread.Sleep(1000);
                    Console.WriteLine($"Task {taskNum} completed");
                });
            }

            Thread.Sleep(12000); // Wait for all tasks to complete
        }

        // Example 4: Using Monitor for synchronization
        private readonly object _monitorLock = new object();
        private Queue<string> _messageQueue = new Queue<string>();

        public void ProducerConsumerWithMonitor()
        {
            Thread producer = new Thread(() =>
            {
                for (int i = 0; i < 10; i++)
                {
                    Monitor.Enter(_monitorLock);
                    try
                    {
                        _messageQueue.Enqueue($"Message {i}");
                        Console.WriteLine($"Produced: Message {i}");
                        Monitor.Pulse(_monitorLock); // Signal waiting threads
                    }
                    finally
                    {
                        Monitor.Exit(_monitorLock);
                    }
                    Thread.Sleep(500);
                }
            });

            Thread consumer = new Thread(() =>
            {
                while (true)
                {
                    Monitor.Enter(_monitorLock);
                    try
                    {
                        while (_messageQueue.Count == 0)
                        {
                            Monitor.Wait(_monitorLock); // Wait for signal
                        }
                        string message = _messageQueue.Dequeue();
                        Console.WriteLine($"Consumed: {message}");
                    }
                    finally
                    {
                        Monitor.Exit(_monitorLock);
                    }
                }
            });

            consumer.IsBackground = true;
            producer.Start();
            consumer.Start();
            producer.Join();
        }
    }
    #endregion

    // ====================================================================================
    // TASK - ASYNC/AWAIT
    // ====================================================================================

    #region ASYNC/AWAIT EXAMPLES
    public class AsyncAwaitExamples
    {
        // Example 1: Basic async/await
        public async Task<string> GetDataAsync()
        {
            Console.WriteLine("Starting async operation...");
            await Task.Delay(2000); // Simulate async operation
            return "Data retrieved successfully";
        }

        // Example 2: Multiple async operations
        public async Task MultipleAsyncOperations()
        {
            Task<string> task1 = GetWebDataAsync("https://api1.example.com");
            Task<string> task2 = GetWebDataAsync("https://api2.example.com");
            Task<string> task3 = GetWebDataAsync("https://api3.example.com");

            // Wait for all tasks to complete
            string[] results = await Task.WhenAll(task1, task2, task3);

            foreach (var result in results)
            {
                Console.WriteLine(result);
            }
        }

        private async Task<string> GetWebDataAsync(string url)
        {
            using (HttpClient client = new HttpClient())
            {
                try
                {
                    // Simulate API call
                    await Task.Delay(1000);
                    return $"Data from {url}";
                }
                catch (Exception ex)
                {
                    return $"Error: {ex.Message}";
                }
            }
        }

        // Example 3: Async with cancellation
        public async Task<string> LongRunningOperationAsync(CancellationToken cancellationToken)
        {
            for (int i = 0; i < 10; i++)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    Console.WriteLine("Operation cancelled");
                    throw new OperationCanceledException();
                }

                Console.WriteLine($"Processing step {i + 1}/10");
                await Task.Delay(1000, cancellationToken);
            }

            return "Operation completed successfully";
        }

        // Example 4: Async with progress reporting
        public async Task DownloadFileAsync(IProgress<int> progress)
        {
            for (int i = 0; i <= 100; i += 10)
            {
                await Task.Delay(500);
                progress?.Report(i);
            }
        }

        // Example 5: Exception handling in async methods
        public async Task<string> SafeAsyncOperation()
        {
            try
            {
                await Task.Delay(1000);
                throw new InvalidOperationException("Something went wrong");
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"Handled exception: {ex.Message}");
                return "Error handled";
            }
            finally
            {
                Console.WriteLine("Cleanup operations");
            }
        }

        // Example 6: ValueTask for performance optimization
        private readonly Dictionary<int, string> _cache = new Dictionary<int, string>();

        public async ValueTask<string> GetCachedDataAsync(int id)
        {
            if (_cache.TryGetValue(id, out string cachedValue))
            {
                return cachedValue; // No allocation, returns synchronously
            }

            // If not in cache, perform async operation
            string value = await FetchFromDatabaseAsync(id);
            _cache[id] = value;
            return value;
        }

        private async Task<string> FetchFromDatabaseAsync(int id)
        {
            await Task.Delay(100);
            return $"Data for ID: {id}";
        }
    }
    #endregion

    // ====================================================================================
    // CONCURRENCY
    // ====================================================================================

    #region CONCURRENCY EXAMPLES
    public class ConcurrencyExamples
    {
        // Example 1: ConcurrentDictionary
        private ConcurrentDictionary<string, int> _concurrentDict = 
            new ConcurrentDictionary<string, int>();

        public async Task ConcurrentDictionaryExample()
        {
            var tasks = new List<Task>();

            for (int i = 0; i < 10; i++)
            {
                int taskId = i;
                tasks.Add(Task.Run(() =>
                {
                    string key = $"key{taskId % 3}";
                    _concurrentDict.AddOrUpdate(key, 1, (k, oldValue) => oldValue + 1);
                    Console.WriteLine($"Task {taskId} updated {key}");
                }));
            }

            await Task.WhenAll(tasks);

            foreach (var kvp in _concurrentDict)
            {
                Console.WriteLine($"{kvp.Key}: {kvp.Value}");
            }
        }

        // Example 2: BlockingCollection (Producer-Consumer pattern)
        public void BlockingCollectionExample()
        {
            BlockingCollection<int> collection = new BlockingCollection<int>(boundedCapacity: 5);

            // Producer
            Task producer = Task.Run(() =>
            {
                for (int i = 0; i < 10; i++)
                {
                    collection.Add(i);
                    Console.WriteLine($"Produced: {i}");
                    Thread.Sleep(100);
                }
                collection.CompleteAdding();
            });

            // Consumers
            Task consumer1 = Task.Run(() =>
            {
                foreach (var item in collection.GetConsumingEnumerable())
                {
                    Console.WriteLine($"Consumer 1 processed: {item}");
                    Thread.Sleep(200);
                }
            });

            Task consumer2 = Task.Run(() =>
            {
                foreach (var item in collection.GetConsumingEnumerable())
                {
                    Console.WriteLine($"Consumer 2 processed: {item}");
                    Thread.Sleep(200);
                }
            });

            Task.WaitAll(producer, consumer1, consumer2);
        }

        // Example 3: Parallel.ForEach
        public void ParallelForEachExample()
        {
            var numbers = Enumerable.Range(1, 100).ToList();
            var parallelOptions = new ParallelOptions
            {
                MaxDegreeOfParallelism = 4 // Limit to 4 parallel threads
            };

            Parallel.ForEach(numbers, parallelOptions, number =>
            {
                Console.WriteLine($"Processing {number} on thread {Thread.CurrentThread.ManagedThreadId}");
                Thread.Sleep(100);
            });
        }

        // Example 4: SemaphoreSlim for limiting concurrent access
        private SemaphoreSlim _semaphore = new SemaphoreSlim(3); // Allow max 3 concurrent accesses

        public async Task SemaphoreExample()
        {
            var tasks = new List<Task>();

            for (int i = 0; i < 10; i++)
            {
                int taskId = i;
                tasks.Add(ProcessWithSemaphoreAsync(taskId));
            }

            await Task.WhenAll(tasks);
        }

        private async Task ProcessWithSemaphoreAsync(int taskId)
        {
            await _semaphore.WaitAsync();
            try
            {
                Console.WriteLine($"Task {taskId} entered critical section");
                await Task.Delay(2000); // Simulate work
                Console.WriteLine($"Task {taskId} leaving critical section");
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Example 5: ReaderWriterLockSlim for read-heavy scenarios
        private ReaderWriterLockSlim _rwLock = new ReaderWriterLockSlim();
        private List<string> _sharedData = new List<string>();

        public void ReadData()
        {
            _rwLock.EnterReadLock();
            try
            {
                foreach (var item in _sharedData)
                {
                    Console.WriteLine($"Reading: {item}");
                }
            }
            finally
            {
                _rwLock.ExitReadLock();
            }
        }

        public void WriteData(string data)
        {
            _rwLock.EnterWriteLock();
            try
            {
                _sharedData.Add(data);
                Console.WriteLine($"Written: {data}");
            }
            finally
            {
                _rwLock.ExitWriteLock();
            }
        }

        // Example 6: Channel for async producer-consumer
        public async Task ChannelExample()
        {
            var channel = System.Threading.Channels.Channel.CreateUnbounded<string>();

            // Producer
            var producer = Task.Run(async () =>
            {
                for (int i = 0; i < 10; i++)
                {
                    await channel.Writer.WriteAsync($"Message {i}");
                    await Task.Delay(100);
                }
                channel.Writer.Complete();
            });

            // Consumer
            var consumer = Task.Run(async () =>
            {
                await foreach (var message in channel.Reader.ReadAllAsync())
                {
                    Console.WriteLine($"Received: {message}");
                }
            });

            await Task.WhenAll(producer, consumer);
        }
    }
    #endregion

    // ====================================================================================
    // DEPENDENCY INJECTION
    // ====================================================================================

    #region DEPENDENCY INJECTION EXAMPLES
    
    // Example 1: Basic Constructor Injection
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        public async Task SendEmailAsync(string to, string subject, string body)
        {
            await Task.Delay(100); // Simulate sending email
            Console.WriteLine($"Email sent to {to}: {subject}");
        }
    }

    public class NotificationService
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;

        // Constructor injection
        public NotificationService(IEmailService emailService, ILogger<NotificationService> logger)
        {
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task NotifyUserAsync(string userId, string message)
        {
            _logger.LogInformation($"Notifying user {userId}");
            await _emailService.SendEmailAsync(userId, "Notification", message);
        }
    }

    // Example 2: Service Registration and Configuration
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Register services with different lifetimes
            services.AddSingleton<DatabaseConnection>(); // Single instance for app lifetime
            services.AddScoped<IUserRepository, UserRepository>(); // New instance per request
            services.AddTransient<IEmailService, EmailService>(); // New instance every time

            // Register with factory
            services.AddScoped<ILogger>(provider =>
            {
                var config = provider.GetRequiredService<IConfiguration>();
                var loggerType = config["LoggerType"];
                return LoggerFactory.CreateLogger(loggerType);
            });

            // Register generic repository
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Register with implementation factory
            services.AddScoped<IDataService>(provider =>
            {
                var connectionString = provider.GetRequiredService<IConfiguration>()["ConnectionString"];
                return new DataService(connectionString);
            });

            // Register multiple implementations
            services.AddScoped<INotificationHandler, EmailNotificationHandler>();
            services.AddScoped<INotificationHandler, SmsNotificationHandler>();
        }
    }

    // Example 3: Generic Repository with DI
    public interface IRepository<T> where T : class
    {
        Task<T> GetByIdAsync(int id);
        Task<IEnumerable<T>> GetAllAsync();
        Task AddAsync(T entity);
    }

    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly DbContext _context;

        public Repository(DbContext context)
        {
            _context = context;
        }

        public async Task<T> GetByIdAsync(int id)
        {
            return await _context.Set<T>().FindAsync(id);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await Task.FromResult(_context.Set<T>().ToList());
        }

        public async Task AddAsync(T entity)
        {
            await _context.Set<T>().AddAsync(entity);
            await _context.SaveChangesAsync();
        }
    }

    // Example 4: Options Pattern with DI
    public class EmailSettings
    {
        public string SmtpServer { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class ConfiguredEmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public ConfiguredEmailService(IOptions<EmailSettings> options)
        {
            _settings = options.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            Console.WriteLine($"Sending email via {_settings.SmtpServer}:{_settings.Port}");
            await Task.Delay(100);
        }
    }

    // Example 5: Service Locator Anti-Pattern (to avoid)
    public class BadExample
    {
        // AVOID THIS - Service Locator is an anti-pattern
        public void DoSomething(IServiceProvider serviceProvider)
        {
            var service = serviceProvider.GetService<IEmailService>();
            // This hides dependencies and makes testing difficult
        }
    }

    // Example 6: Property Injection (less common, but sometimes useful)
    public class PropertyInjectionExample
    {
        // Property injection - set by DI container
        public ILogger Logger { get; set; }

        public void DoWork()
        {
            Logger?.LogInformation("Working...");
        }
    }

    // Example 7: Method Injection
    public class MethodInjectionExample
    {
        public void ProcessData(IDataProcessor processor, string data)
        {
            // Method injection - dependency passed as parameter
            processor.Process(data);
        }
    }

    // Example 8: Custom Service Provider Implementation
    public class SimpleServiceProvider : IServiceProvider
    {
        private readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();

        public void Register<T>(T service)
        {
            _services[typeof(T)] = service;
        }

        public object GetService(Type serviceType)
        {
            return _services.TryGetValue(serviceType, out var service) ? service : null;
        }
    }
    #endregion

    // ====================================================================================
    // INTERFACES IN C# 8.0+
    // ====================================================================================

    #region INTERFACE IMPLEMENTATION
    // Yes, you CAN implement methods in interfaces (C# 8.0+)
    public interface IModernInterface
    {
        // Abstract method (must be implemented)
        void AbstractMethod();

        // Default implementation (can be overridden)
        public void DefaultMethod()
        {
            Console.WriteLine("Default implementation in interface");
        }

        // Static method in interface
        public static void StaticMethod()
        {
            Console.WriteLine("Static method in interface");
        }

        // Property with default implementation
        public string Name { get; set; }

        // Default property implementation
        public int Count => 42;

        // Private method in interface (helper method)
        private void PrivateHelper()
        {
            Console.WriteLine("Private helper in interface");
        }

        // Protected method (for inheritance scenarios)
        protected void ProtectedMethod()
        {
            Console.WriteLine("Protected method in interface");
        }
    }

    public class ModernClass : IModernInterface
    {
        public string Name { get; set; }

        // Must implement abstract method
        public void AbstractMethod()
        {
            Console.WriteLine("Implemented abstract method");
        }

        // Optionally override default method
        public void DefaultMethod()
        {
            Console.WriteLine("Overridden default method");
        }
    }
    #endregion

    // ====================================================================================
    // MAIN PROGRAM TO DEMONSTRATE
    // ====================================================================================

    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== C# Interview Examples ===\n");

            // Design Patterns
            Console.WriteLine("1. SINGLETON PATTERN:");
            var db1 = DatabaseConnection.Instance;
            var db2 = DatabaseConnection.Instance;
            Console.WriteLine($"Same instance: {ReferenceEquals(db1, db2)}");
            db1.ExecuteQuery("SELECT * FROM Users");

            Console.WriteLine("\n2. FACTORY PATTERN:");
            var fileLogger = LoggerFactory.CreateLogger("FILE");
            fileLogger.Log("Application started");

            Console.WriteLine("\n3. OBSERVER PATTERN:");
            var subject = new Subject();
            subject.Attach(new EmailNotifier());
            subject.Attach(new SmsNotifier());
            subject.Notify("Order completed!");

            // Async/Await
            Console.WriteLine("\n4. ASYNC/AWAIT:");
            var asyncExamples = new AsyncAwaitExamples();
            string result = await asyncExamples.GetDataAsync();
            Console.WriteLine(result);

            // Cancellation example
            Console.WriteLine("\n5. CANCELLATION TOKEN:");
            var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            try
            {
                await asyncExamples.LongRunningOperationAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("Operation was cancelled");
            }

            // Concurrent Collections
            Console.WriteLine("\n6. CONCURRENT DICTIONARY:");
            var concurrencyExamples = new ConcurrencyExamples();
            await concurrencyExamples.ConcurrentDictionaryExample();

            // Dependency Injection
            Console.WriteLine("\n7. DEPENDENCY INJECTION:");
            var services = new ServiceCollection();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<NotificationService>();
            services.AddLogging();

            var serviceProvider = services.BuildServiceProvider();
            var notificationService = serviceProvider.GetService<NotificationService>();
            await notificationService.NotifyUserAsync("user@example.com", "Welcome!");

            // Interface Default Implementation
            Console.WriteLine("\n8. INTERFACE DEFAULT IMPLEMENTATION:");
            IModernInterface modern = new ModernClass();
            modern.AbstractMethod();
            modern.DefaultMethod();
            IModernInterface.StaticMethod();

            Console.WriteLine("\n=== Examples Completed ===");
        }
    }

    // Helper classes for DI examples
    public interface IConfiguration
    {
        string this[string key] { get; }
    }

    public interface IOptions<T> where T : class
    {
        T Value { get; }
    }

    public interface IDataService
    {
        Task<string> GetDataAsync();
    }

    public class DataService : IDataService
    {
        private readonly string _connectionString;

        public DataService(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<string> GetDataAsync()
        {
            await Task.Delay(100);
            return "Data from database";
        }
    }

    public interface INotificationHandler
    {
        Task HandleAsync(string message);
    }

    public class EmailNotificationHandler : INotificationHandler
    {
        public async Task HandleAsync(string message)
        {
            await Task.Delay(100);
            Console.WriteLine($"Email notification: {message}");
        }
    }

    public class SmsNotificationHandler : INotificationHandler
    {
        public async Task HandleAsync(string message)
        {
            await Task.Delay(100);
            Console.WriteLine($"SMS notification: {message}");
        }
    }

    public interface IDataProcessor
    {
        void Process(string data);
    }

    // Mock DbContext for Repository pattern
    public class DbContext
    {
        public virtual DbSet<T> Set<T>() where T : class
        {
            return new DbSet<T>();
        }

        public virtual Task<int> SaveChangesAsync()
        {
            return Task.FromResult(1);
        }
    }

    public class DbSet<T> where T : class
    {
        private List<T> _data = new List<T>();

        public async Task<T> FindAsync(params object[] keyValues)
        {
            await Task.Delay(10);
            return _data.FirstOrDefault();
        }

        public List<T> ToList()
        {
            return _data.ToList();
        }

        public async Task AddAsync(T entity)
        {
            await Task.Delay(10);
            _data.Add(entity);
        }
    }
}